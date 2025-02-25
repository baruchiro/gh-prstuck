import { GitHubService } from './github.service.js';

export class PRHealthService {
    constructor() {
        this.githubService = new GitHubService();
    }

    async checkPRHealth(pr) {
        const result = await this.githubService.getPRStatus(pr);

        if (result.error) {
            return {
                url: result.url,
                status: 'ERROR',
                issues: [result.error]
            };
        }

        const issues = [];

        // Check mergeability
        if (result.mergeable === false) {
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

        return {
            url: result.url,
            title: result.title,
            draft: result.draft,
            state: result.state,
            merged: result.merged,
            status: issues.length === 0 ? 'HEALTHY' : 'UNHEALTHY',
            issues: issues.length > 0 ? issues : [],
            base: result.base,
            head: result.head,
            reviews: result.reviews
        };
    }
} 