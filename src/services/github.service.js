import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';

dotenv.config();

export class GitHubService {
    constructor() {
        this.octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN
        });
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

            return {
                url: prUrl,
                title: pr.title,
                draft: pr.draft,
                mergeable: pr.mergeable,
                mergeable_state: pr.mergeable_state,
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
                }))
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