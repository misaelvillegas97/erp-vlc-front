import packageJson from '../../package.json';

export const environment = {
  production : false,
  appVersion : packageJson.version,
  BACKEND_URL: 'http://localhost:3000/',
  ENCRYPTION_KEY: '2dc38ecf-0aef-443c-8585-ea876df46493',
  GMAPS_API_KEY  : 'AIzaSyDuuXk4YZ8E5mPXUsrqmGHbSHel4BniHCs',
  // API keys for utility widgets
  fuelApiKey     : 'YOUR_FUEL_API_KEY', // Replace with actual fuel prices API key
  fuelApiEmail   : 'david.misa97@gmail.com', // Replace with actual fuel API email
  fuelApiPassword: 'DavidVillegas97', // Replace with actual fuel API password
  newsApiKey     : 'YOUR_NEWS_API_KEY' // Replace with actual news API key
};
