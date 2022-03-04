module.exports = {
    content: [
        "./index.html",
        "./src/**/*.ts",
    ],
    theme: {
        extend: {
            fontFamily: {
                comic: ["Comic Sans MS"],
            },
            colors: {
                bunker: {
                    green: "#77c277",
                    white: "#f0f0f0",
                    black: "#212121",
                }
            }
        },
    },
    plugins: [],
};
