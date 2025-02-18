import { GitHubService } from './github.service.js';
export class PRHealthService {
  constructor() {
    this.githubService = new GitHubService();
  }
  async checkPRsHealth(prs) {
    const results = await Promise.all(prs.map(pr => this.githubService.getPRStatus(pr)));
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
      return {
        url: pr.url,
        title: pr.title,
        status: issues.length === 0 ? 'HEALTHY' : 'UNHEALTHY',
        issues: issues.length > 0 ? issues : []
      };
    });
  }
}