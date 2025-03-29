module.exports = {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          'ig-primary': '#0095f6',
          'ig-secondary': '#8e8e8e',
          'ig-border': '#dbdbdb',
          'ig-bg': '#fafafa'
        },
        spacing: {
          '18': '4.5rem',
          '22': '5.5rem',
          '100': '25rem'
        }
      },
    },
    plugins: [],
  }