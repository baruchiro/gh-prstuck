import { EventEmitter } from 'events';
import { PRHealthService } from '../services/pr-health.service.js';

export class PRHealthStore extends EventEmitter {
    constructor() {
        super();
        this.prHealthService = new PRHealthService();
        this.results = {};
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
        this.results = {};
        this.emit('stateChanged', this.getState());

        try {
            const features = Object.entries(featurePRs);

            const promises = [];

            // Process features sequentially to maintain feature order
            for (const [feature, prs] of features) {
                this.results[feature] = [];
                this.emit('stateChanged', this.getState());

                // Create an array of promises that will each update the state when resolved
                const prPromises = prs.map(async (pr, index) => {
                    try {
                        const prResult = await this.prHealthService.checkPRHealth(pr);
                        // Update results atomically
                        this.results[feature][index] = prResult;
                        this.emit('stateChanged', this.getState());
                        return prResult;
                    } catch (error) {
                        console.error(`Error processing PR ${pr}:`, error);
                        return {
                            url: pr,
                            error: error.message,
                            status: 'ERROR'
                        };
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