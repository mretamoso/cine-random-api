
import express from 'express';
import cors from 'cors';
import {
  getTodayShowtimes,
  groupByMovie,
  isTimeFromNow
} from './services/scraper.js';


const app = express();
// const PORT = 3001;
const PORT = process.env.PORT || 3001;

app.use(cors());

app.get('/api/random-movie', async (req, res) => {
  try {
    const cineSlug = req.query.cine || 'cineplanet-san-miguel';

    const allShowtimes = await getTodayShowtimes(cineSlug);

    const agrupadas = groupByMovie(allShowtimes);

    const candidatas = agrupadas.filter(movie =>
      movie.horarios.some(h => isTimeFromNow(h))
    );

    if (!candidatas.length) {
      return res.status(404).json({
        message: 'No se encontraron funciones a partir de la hora actual 🙁'
      });
    }

    const idx = Math.floor(Math.random() * candidatas.length);
    const randomMovie = candidatas[idx];

    const horariosFuturos = randomMovie.horarios.filter(h =>
      isTimeFromNow(h)
    );

    res.json({
      cine: cineSlug,
      titulo: randomMovie.titulo,
      horarios: horariosFuturos
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Error obteniendo datos del cine',
      error: err.message
    });
  }
});


app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});
