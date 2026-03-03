module.exports = (options) => {
  const externals = Array.isArray(options.externals)
    ? [...options.externals, { sharp: 'commonjs sharp' }]
    : [options.externals || {}, { sharp: 'commonjs sharp' }];

  return {
    ...options,
    externals,
  };
};
