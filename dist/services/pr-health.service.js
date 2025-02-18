import { GitHubService } from './github.service.js';
export class PRHealthService {
  constructor() {
    this.githubService = new GitHubService();
  }
  async checkPRsHealth(prs) {
    const results = await Promise.all(prs.map(pr => this.githubService.getPRStatus(pr)));

    // First pass to collect all head branches
    const headBranches = new Map();
    results.forEach(pr => {
      if (!pr.error && pr.head) {
        const key = `${pr.head.repo}:${pr.head.ref}`;
        headBranches.set(key, pr.url);
      }
    });
    return results.map(pr => {
      if (pr.error) {
        return {
          url: pr.url,
          status: 'ERROR',
          issues: [pr.error]
        };
      }
      const issues = [];

      // Check mergeability
      if (pr.mergeable === false) {
        issues.push('Has conflicts');
      }

      // Check CI status
      if (pr.checks && pr.checks.length > 0) {
        const failingChecks = pr.checks.filter(check => check.conclusion && check.conclusion !== 'success');
        if (failingChecks.length > 0) {
          issues.push(`Failing checks: ${failingChecks.map(check => check.name).join(', ')}`);
        }
      }

      // Find parent PR if this PR's base branch matches another PR's head branch
      const parentKey = `${pr.base.repo}:${pr.base.ref}`;
      const parentPrUrl = headBranches.get(parentKey);
      return {
        url: pr.url,
        title: pr.title,
        draft: pr.draft,
        status: issues.length === 0 ? 'HEALTHY' : 'UNHEALTHY',
        issues: issues.length > 0 ? issues : [],
        parentPrUrl
      };
    });
  }
}