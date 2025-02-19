import { EventEmitter } from 'events';
import { PRHealthService } from '../services/pr-health.service.js';

export class PRHealthStore extends EventEmitter {
    constructor() {
        super();
        this.prHealthService = new PRHealthService();
        this.results = {
            Features: {},
            prs: {}
        };
        this.loading = true;
        this.error = null;
    }

    getState() {
        return {
            results: this.results,
            loading: this.loading,
            error: this.error
        };
    }

    async checkHealth(featurePRs) {
        this.loading = true;
        this.error = null;
        this.results = {
            Features: {},
            prs: {}
        };
        this.emit('stateChanged', this.getState());

        try {
            const features = Object.entries(featurePRs.Features || featurePRs);
            const promises = [];

            // Process features sequentially to maintain feature order
            for (const [featureName, feature] of features) {
                // Initialize feature structure
                this.results.Features[featureName] = {
                    prs: feature.prs || feature,
                    dependencies: feature.dependencies || []
                };
                this.emit('stateChanged', this.getState());

                // Create an array of promises that will each update the state when resolved
                const prPromises = this.results.Features[featureName].prs.map(async (pr) => {
                    try {
                        const prResult = await this.prHealthService.checkPRHealth(pr);
                        // Store PR results in the prs map
                        this.results.prs[pr] = prResult;
                        this.emit('stateChanged', this.getState());
                        return prResult;
                    } catch (error) {
                        console.error(`Error processing PR ${pr}:`, error);
                        this.results.prs[pr] = {
                            url: pr,
                            error: error.message,
                            status: 'ERROR'
                        };
                        return this.results.prs[pr];
                    }
                });

                promises.push(...prPromises);
            }

            await Promise.all(promises);
        } catch (error) {
            this.error = error.message;
            this.emit('stateChanged', this.getState());
        } finally {
            this.loading = false;
            this.emit('stateChanged', this.getState());
        }
    }
} 