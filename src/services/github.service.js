import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';

dotenv.config();

export class GitHubService {
    constructor() {
        this.octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN
        });
    }

    async getMyPRs() {
        try {
            const { data: prs } = await this.octokit.search.issuesAndPullRequests({
                q: 'is:pr is:open author:@me',
                sort: 'updated',
                order: 'desc',
                per_page: 100
            });

            return prs.items.map(pr => ({
                url: pr.html_url,
                title: pr.title,
                draft: pr.draft || false,
                repository: pr.repository_url.split('/').slice(-1)[0]
            }));
        } catch (error) {
            console.error('Error fetching PRs:', error.message);
            throw error;
        }
    }

    async getPRsToReview() {
        try {
            const { data: prs } = await this.octokit.search.issuesAndPullRequests({
                q: 'is:pr is:open review-requested:@me',
                sort: 'updated',
                order: 'desc',
                per_page: 100
            });

            return prs.items.map(pr => ({
                url: pr.html_url,
                title: pr.title,
                draft: pr.draft || false,
                repository: pr.repository_url.split('/').slice(-1)[0]
            }));
        } catch (error) {
            console.error('Error fetching PRs to review:', error.message);
            throw error;
        }
    }

    async getAssignedPRs() {
        try {
            const { data: prs } = await this.octokit.search.issuesAndPullRequests({
                q: 'is:pr is:open assignee:@me',
                sort: 'updated',
                order: 'desc',
                per_page: 100
            });

            return prs.items.map(pr => ({
                url: pr.html_url,
                title: pr.title,
                draft: pr.draft || false,
                repository: pr.repository_url.split('/').slice(-1)[0]
            }));
        } catch (error) {
            console.error('Error fetching assigned PRs:', error.message);
            throw error;
        }
    }

    async getPRStatus(prUrl) {
        try {
            // Extract owner, repo, and PR number from URL
            const [, , , owner, repo, , prNumber] = prUrl.split('/');

            // Get PR details
            const { data: pr } = await this.octokit.pulls.get({
                owner,
                repo,
                pull_number: parseInt(prNumber)
            });

            // Get check runs
            const { data: checks } = await this.octokit.checks.listForRef({
                owner,
                repo,
                ref: pr.head.sha
            });

            // Get reviews
            const { data: reviews } = await this.octokit.pulls.listReviews({
                owner,
                repo,
                pull_number: parseInt(prNumber)
            });

            // Process reviews to get latest state per reviewer
            const latestReviews = new Map();
            reviews.forEach(review => {
                if (review.state !== 'COMMENTED') { // Only track approval/rejection states
                    latestReviews.set(review.user.login, review);
                }
            });

            const reviewSummary = {
                approved: Array.from(latestReviews.values()).filter(r => r.state === 'APPROVED').length,
                changes_requested: Array.from(latestReviews.values()).filter(r => r.state === 'CHANGES_REQUESTED').length,
                reviewers: pr.requested_reviewers.map(r => r.login),
                // Add reviewer names
                approvers: Array.from(latestReviews.values())
                    .filter(r => r.state === 'APPROVED')
                    .map(r => r.user.login),
                change_requesters: Array.from(latestReviews.values())
                    .filter(r => r.state === 'CHANGES_REQUESTED')
                    .map(r => r.user.login)
            };

            return {
                url: prUrl,
                title: pr.title,
                draft: pr.draft,
                mergeable: pr.mergeable,
                mergeable_state: pr.mergeable_state,
                state: pr.state,
                merged: pr.merged,
                base: {
                    ref: pr.base.ref,
                    sha: pr.base.sha,
                    repo: pr.base.repo.full_name
                },
                head: {
                    ref: pr.head.ref,
                    sha: pr.head.sha,
                    repo: pr.head.repo.full_name
                },
                checks: checks.check_runs.map(check => ({
                    name: check.name,
                    status: check.status,
                    conclusion: check.conclusion
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