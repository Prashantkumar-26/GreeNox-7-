const express = require('express');
const router = express.Router();

// Weather condition code mapping
function getWeatherCondition(code) {
  const map = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    95: 'Thunderstorm'
  };
  return map[code] || 'Clear';
}

// Suggest dishes based on current temperature
function getRecommendation(temp) {
  if (temp >= 30) {
    return {
      dish: 'Watermelon Mint Mojito & Mix Berry Shake',
      reason: 'Cool down with an ice-cold hydrating beverage.'
    };
  } else if (temp <= 18) {
    return {
      dish: 'Kulhad Chai & Paneer Tikka Wrap',
      reason: 'Warm up with freshly brewed tea and a hot wrap.'
    };
  }
  return {
    dish: 'Avocado Veg Burrito Bowl & Whey Protein Shake',
    reason: 'Balanced power meal for campus study sessions.'
  };
}

// Fetch live weather (supports WeatherAPI key if provided, otherwise uses Open-Meteo)
router.get('/weather', async (req, res) => {
  const lat = process.env.CAMPUS_LAT || 28.248;
  const lon = process.env.CAMPUS_LON || 76.814;
  const apiKey = req.query.key || process.env.WEATHER_API_KEY;

  // 1. If an API key is provided, try WeatherAPI.com
  if (apiKey) {
    try {
      const weatherApiUrl = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lon}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const response = await fetch(weatherApiUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        const temp = data.current ? data.current.temp_c : 22;
        const wind = data.current ? data.current.wind_kph : 10;
        const condition = data.current && data.current.condition ? data.current.condition.text : 'Clear';
        return res.json({
          success: true,
          source: 'WeatherAPI.com (Online Keyed API)',
          campus: 'BML Munjal University, Gurugram',
          data: {
            temperature: temp,
            unit: '°C',
            windspeed: wind,
            condition: condition,
            recommendation: getRecommendation(temp)
          }
        });
      } else {
        console.warn(`WeatherAPI returned HTTP ${response.status}, falling back to Open-Meteo`);
      }
    } catch (keyErr) {
      console.warn('WeatherAPI key fetch failed, falling back to Open-Meteo:', keyErr.message);
    }
  }

  // 2. Open-Meteo live online API
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=Asia%2FKolkata`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const apiRes = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!apiRes.ok) throw new Error(`Weather API returned ${apiRes.status}`);

    const data = await apiRes.json();
    const current = data.current_weather || {};
    const temp = current.temperature ?? 22;

    return res.json({
      success: true,
      source: 'Open-Meteo Online API',
      campus: 'BML Munjal University, Gurugram',
      data: {
        temperature: temp,
        unit: '°C',
        windspeed: current.windspeed || 8,
        weathercode: current.weathercode,
        condition: getWeatherCondition(current.weathercode),
        recommendation: getRecommendation(temp)
      }
    });
  } catch (err) {
    const fallbackTemp = 22.0;
    return res.json({
      success: true,
      source: 'Campus Weather Cache',
      campus: 'BML Munjal University, Gurugram',
      data: {
        temperature: fallbackTemp,
        unit: '°C',
        windspeed: 8.5,
        weathercode: 1,
        condition: 'Mainly clear',
        recommendation: getRecommendation(fallbackTemp)
      }
    });
  }
});

// Daily nutrition advice
router.get('/health-tip', async (req, res) => {
  const localTips = [
    { tip: 'Pair high-protein meals with plenty of water for better energy.', author: 'GreeNox Nutrition Team' },
    { tip: 'Whole grains and leafy greens help sustain focus throughout lectures.', author: 'BMU Wellness Cell' },
    { tip: 'Healthy fats like avocado support steady metabolism.', author: 'GreeNox Kitchen' }
  ];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch('https://dummyjson.com/quotes/random', { signal: controller.signal });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      return res.json({
        success: true,
        source: 'DummyJSON',
        data: { quote: data.quote, author: data.author }
      });
    }
    throw new Error('Fallback needed');
  } catch (err) {
    const randomTip = localTips[Math.floor(Math.random() * localTips.length)];
    return res.json({
      success: true,
      source: 'Local advice',
      data: { quote: randomTip.tip, author: randomTip.author }
    });
  }
});

module.exports = router;
