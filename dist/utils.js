"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRouteName = (path) => (path ? path.split('/')[1] : '');
