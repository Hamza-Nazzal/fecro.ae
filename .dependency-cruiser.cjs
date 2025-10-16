/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: 'node_modules|^src/_archive/',
    combinedDependencies: true
  },
  forbidden: [
    {
      name: "no-orphans",
      severity: "warn",
      from: {},
      to: { orphan: true }
    }
  ]
};
