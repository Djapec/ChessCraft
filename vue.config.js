const { DefinePlugin } = require('webpack');

module.exports = {
    chainWebpack: (config) => {
        config.resolve.alias.set('vue', '@vue/compat');

        config.module
            .rule('vue')
            .use('vue-loader')
            .tap((options) => {
                return {
                    ...options,
                    compilerOptions: {
                        compatConfig: {
                            MODE: 2
                        }
                    }
                };
            });

        config.plugin('define')
            .use(DefinePlugin, [{
                __VUE_OPTIONS_API__: JSON.stringify(true),
                __VUE_PROD_DEVTOOLS__: JSON.stringify(false),
                __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(false),
            }]);

        // Dodavanje podrške za TypeScript
        config.module
            .rule('ts')
            .test(/\.ts$/)
            .use('ts-loader')
            .loader('ts-loader')
            .options({ appendTsSuffixTo: [/\.vue$/] })
            .end();
    }
};
