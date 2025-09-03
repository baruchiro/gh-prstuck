import { graphql } from '@octokit/graphql';
import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';

dotenv.config();

const prFragment = `
fragment prFields on PullRequest {
    url
    title
    isDraft
    author {
        login
    }
    repository {
        name
    }
}`;

const prDetailsFragment = `
fragment prDetailsFields on PullRequest {
    ...prFields
    mergeable
    mergeStateStatus
    state
    merged
    baseRef {
        name
        target { oid }
        repository { nameWithOwner }
    }
    headRef {
        name
        target { oid }
        repository { nameWithOwner }
    }
    commits(last: 1) {
        nodes {
            commit {
                checkSuites(first: 10) {
                    nodes {
                        checkRuns(first: 20) {
                            nodes {
                                name
                                status
                                conclusion
                            }
                        }
                    }
                }
            }
        }
    }
    reviews(first: 100) {
        nodes {
            author { login }
            state
        }
    }
    reviewRequests(first: 100) {
        nodes {
            requestedReviewer {
                ... on User { login }
            }
        }
    }
}`;

const searchPRsQuery = `
${prFragment}
query($queryString: String!) {
    search(query: $queryString, type: ISSUE, first: 100) {
        nodes {
            ...prFields
        }
    }
}`;

const getPRStatusQuery = `
${prFragment}
${prDetailsFragment}
query($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
        pullRequest(number: $number) {
            ...prDetailsFields
        }
    }
}`;

export class GitHubService {
    constructor() {
        this.octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN
        });
        this.graphqlWithAuth = graphql.defaults({
            headers: {
                authorization: `token ${process.env.GITHUB_TOKEN}`,
            },
        });
        this.currentUser = null;
    }

    async getCurrentUser() {
        if (this.currentUser) {
            return this.currentUser;
        }

        try {
            const { data } = await this.octokit.rest.users.getAuthenticated();
            this.currentUser = data.login;
            return this.currentUser;
        } catch (error) {
            console.error('Error fetching current user:', error.message);
            throw error;
        }
    }

    async searchPRs(query) {
        try {
            const { search: { nodes } } = await this.graphqlWithAuth(searchPRsQuery, {
                queryString: query
            });

            return nodes.map(pr => ({
                url: pr.url,
                title: pr.title,
                draft: pr.isDraft,
                author: pr.author.login,
                repository: pr.repository.name
            }));
        } catch (error) {
            console.error('Error fetching PRs:', error.message);
            throw error;
        }
    }

    async getMyPRs() {
        return this.searchPRs('is:pr is:open author:@me');
    }

    async getPRsToReview() {
        return this.searchPRs('is:pr is:open review-requested:@me');
    }

    async getAssignedPRs() {
        return this.searchPRs('is:pr is:open assignee:@me');
    }

    async getPRStatus(prUrl) {
        try {
            const [, , , owner, repo, , prNumber] = prUrl.split('/');

            const { repository: { pullRequest: pr } } = await this.graphqlWithAuth(getPRStatusQuery, {
                owner,
                repo,
                number: parseInt(prNumber)
            });

            // Process reviews to get latest state per reviewer
            const latestReviews = new Map();
            pr.reviews.nodes.forEach(review => {
                if (review.state !== 'COMMENTED') {
                    latestReviews.set(review.author.login, review);
                }
            });

            // Flatten check runs from all check suites
            const checkRuns = pr.commits.nodes[0].commit.checkSuites.nodes
                .flatMap(suite => suite.checkRuns.nodes)
                .filter(Boolean);

            const reviewSummary = {
                approved: Array.from(latestReviews.values()).filter(r => r.state === 'APPROVED').length,
                changes_requested: Array.from(latestReviews.values()).filter(r => r.state === 'CHANGES_REQUESTED').length,
                reviewers: pr.reviewRequests.nodes
                    .map(request => request.requestedReviewer?.login)
                    .filter(Boolean),
                approvers: Array.from(latestReviews.values())
                    .filter(r => r.state === 'APPROVED')
                    .map(r => r.author.login),
                change_requesters: Array.from(latestReviews.values())
                    .filter(r => r.state === 'CHANGES_REQUESTED')
                    .map(r => r.author.login)
            };

            return {
                url: pr.url,
                title: pr.title,
                draft: pr.isDraft,
                author: pr.author.login,
                mergeable: pr.mergeable === 'MERGEABLE',
                mergeable_state: pr.mergeStateStatus.toLowerCase(),
                state: pr.state.toLowerCase(),
                merged: pr.merged,
                base: {
                    ref: pr.baseRef.name,
                    sha: pr.baseRef.target.oid,
                    repo: pr.baseRef.repository.nameWithOwner
                },
                head: pr.headRef ? {
                    ref: pr.headRef.name,
                    sha: pr.headRef.target.oid,
                    repo: pr.headRef.repository.nameWithOwner
                } : null,
                checks: checkRuns.map(check => ({
                    name: check.name,
                    status: check.status.toLowerCase(),
                    conclusion: check.conclusion?.toLowerCase()
                })),
                reviews: reviewSummary
            };
        } catch (error) {
            console.error(`Error fetching PR status for ${prUrl}:`, error.message);
            return {
                url: prUrl,
                error: error.message
            };
        }
    }
} 