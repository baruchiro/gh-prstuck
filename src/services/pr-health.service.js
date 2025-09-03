import { GitHubService } from './github.service.js';

export class PRHealthService {
    constructor() {
        this.githubService = new GitHubService();
    }

    async checkPRHealth(pr, prsToReviewUrls = new Set()) {
        const result = await this.githubService.getPRStatus(pr);

        if (result.error) {
            return {
                url: result.url,
                title: result.title || 'Unknown PR',
                status: 'ERROR',
                issues: [result.error]
            };
        }

        const issues = [];

        // Skip mergeability check for merged PRs
        if (!result.merged && result.mergeable === false) {
            issues.push('Has conflicts');
        }

        // Check CI status
        if (result.checks && result.checks.length > 0) {
            const failingChecks = result.checks.filter(check =>
                check.conclusion && check.conclusion !== 'success'
            );

            if (failingChecks.length > 0) {
                issues.push(`Failing checks: ${failingChecks.map(check => check.name).join(', ')}`);
            }
        }

        // Check if this PR is waiting for the user's review
        const waitingForReview = prsToReviewUrls.has(result.url);

        return {
            url: result.url,
            title: result.title,
            draft: result.draft,
            author: result.author,
            state: result.state,
            merged: result.merged,
            status: result.merged ? 'MERGED' : (issues.length === 0 ? 'HEALTHY' : 'UNHEALTHY'),
            issues: issues.length > 0 ? issues : [],
            base: result.base,
            head: result.head,
            reviews: result.reviews,
            waitingForReview
        };
    }
} 