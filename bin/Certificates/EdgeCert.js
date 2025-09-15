"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EdgeCertResource = void 0;
const Bases_1 = require("../Bases");
class EdgeCertProvider {
    name;
    constructor(name) {
        this.name = name;
    }
    async create(inputs) {
        // Implementation for creating an Edge Certificate
        return { id: this.name, outs: {} };
    }
}
class EdgeCertResource extends Bases_1.BaseResource {
    name;
    constructor(name, props, opts) {
        super(new EdgeCertProvider(name), `drunk-pulumi:custom:EdgeCertProvider:${name}`, props, opts);
        this.name = name;
    }
}
exports.EdgeCertResource = EdgeCertResource;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRWRnZUNlcnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvQ2VydGlmaWNhdGVzL0VkZ2VDZXJ0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLG9DQUFtRTtBQVFuRSxNQUFNLGdCQUFnQjtJQUNBO0lBQXBCLFlBQW9CLElBQVk7UUFBWixTQUFJLEdBQUosSUFBSSxDQUFRO0lBQUcsQ0FBQztJQUVwQyxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQXNCO1FBQ2pDLGtEQUFrRDtRQUNsRCxPQUFPLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDO0lBQ3JDLENBQUM7Q0FDRjtBQUVELE1BQWEsZ0JBQWlCLFNBQVEsb0JBQTZDO0lBQ2pFLElBQUksQ0FBUztJQUU3QixZQUFZLElBQVksRUFBRSxLQUFrQyxFQUFFLElBQW1DO1FBQy9GLEtBQUssQ0FBQyxJQUFJLGdCQUFnQixDQUFDLElBQUksQ0FBQyxFQUFFLHdDQUF3QyxJQUFJLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDL0YsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7SUFDbkIsQ0FBQztDQUNGO0FBUEQsNENBT0MifQ==