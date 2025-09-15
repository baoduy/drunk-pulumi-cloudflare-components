"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseComponent = void 0;
exports.getComponentResourceType = getComponentResourceType;
const pulumi = __importStar(require("@pulumi/pulumi"));
function getComponentResourceType(type) {
    return type.includes('drunk-pulumi') ? type : `drunk:pulumi:${type}`;
}
/**
 * BaseComponent serves as an abstract foundation class for Pulumi resource components.
 * It provides core functionality and structure for creating custom infrastructure components.
 *
 * @template TArgs - Generic type parameter extending pulumi.Inputs to define component arguments
 * @extends pulumi.ComponentResource<TArgs>
 */
/**
 * @template TArgs - Generic type parameter extending pulumi.Inputs
 * @example
 * // Add usage example here
 * const component = new MyComponent('name', args);
 */
class BaseComponent extends pulumi.ComponentResource {
    name;
    args;
    opts;
    /**
     * Creates a new instance of BaseComponent
     * @param type - The resource type identifier for this component
     * @param name - Unique name for this component instance
     * @param args - Configuration arguments for this component
     * @param opts - Optional Pulumi resource options to control component behavior
     */
    constructor(type, name, args, opts) {
        super(getComponentResourceType(type), name, args, opts);
        this.name = name;
        this.args = args;
        this.opts = opts;
    }
    /**
     * Registers component outputs with the Pulumi engine.
     * This method should be overridden by derived classes to ensure proper output registration.
     * @param outputs - The outputs to register for this component
     */
    registerOutputs() {
        super.registerOutputs(this.getOutputs());
    }
}
exports.BaseComponent = BaseComponent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQmFzZUNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9CYXNlcy9CYXNlQ29tcG9uZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVBLDREQUVDO0FBSkQsdURBQXlDO0FBRXpDLFNBQWdCLHdCQUF3QixDQUFDLElBQVk7SUFDbkQsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixJQUFJLEVBQUUsQ0FBQztBQUN2RSxDQUFDO0FBRUQ7Ozs7OztHQU1HO0FBQ0g7Ozs7O0dBS0c7QUFDSCxNQUFzQixhQUEyQyxTQUFRLE1BQU0sQ0FBQyxpQkFBd0I7SUFVcEY7SUFDRztJQUNBO0lBWHJCOzs7Ozs7T0FNRztJQUNILFlBQ0UsSUFBWSxFQUNJLElBQVksRUFDVCxJQUFXLEVBQ1gsSUFBc0M7UUFFekQsS0FBSyxDQUFDLHdCQUF3QixDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFKeEMsU0FBSSxHQUFKLElBQUksQ0FBUTtRQUNULFNBQUksR0FBSixJQUFJLENBQU87UUFDWCxTQUFJLEdBQUosSUFBSSxDQUFrQztJQUczRCxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNPLGVBQWU7UUFDdkIsS0FBSyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztJQUMzQyxDQUFDO0NBUUY7QUFoQ0Qsc0NBZ0NDIn0=