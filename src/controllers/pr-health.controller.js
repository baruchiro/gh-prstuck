import { PRHealthService } from '../services/pr-health.service.js';

export class PRHealthController {
    constructor() {
        this.prHealthService = new PRHealthService();
    }

    async checkHealth(featurePRs) {
        try {
            const results = {};
            
            for (const [feature, prs] of Object.entries(featurePRs)) {
                const healthResults = await this.prHealthService.checkPRsHealth(prs);
                results[feature] = healthResults;
            }

            return results;
        } catch (error) {
            console.error('Error checking PR health:', error);
            throw error;
        }
    }
} 