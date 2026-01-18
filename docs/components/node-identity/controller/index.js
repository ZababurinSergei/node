// src/components/node-identity/controller/index.ts
var controller = (context) => {
  let intervalId = null;
  return {
    async init() {
      intervalId = setInterval(() => {
        context.updateUptime();
      }, 1e3);
    },
    async destroy() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }
  };
};
export {
  controller
};
//# sourceMappingURL=index.js.map
