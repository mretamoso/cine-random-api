// src/services/scraper.js
import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://lacartelera.pe/cine/';

export async function getTodayShowtimes(cineSlug) {
  const url = `${BASE_URL}${cineSlug}`;

  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
  });

  const $ = cheerio.load(response.data);

  const resultados = [];

  $('h3').each((_, el) => {
    const titulo = $(el).text().trim();
    if (!titulo) return;

    let horarios = [];
    let node = $(el).next();

    while (node.length) {
      if (node.is('h3')) break;

      node.find('li').each((__, li) => {
        const horaTxt = $(li).text().trim();
        if (/^\d{1,2}:\d{2}$/.test(horaTxt)) {
          horarios.push(horaTxt);
        }
      });

      node = node.next();
    }

    horarios.forEach(hora => {
      resultados.push({ titulo, hora });
    });
  });

  return resultados;
}

export function filterFromNow(showtimes) {
  const ahora = new Date();
  const hoy = new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    ahora.getDate()
  );

  return showtimes.filter(s => {
    const [h, m] = s.hora.split(':').map(Number);
    const fechaFuncion = new Date(hoy);
    fechaFuncion.setHours(h, m, 0, 0);
    return fechaFuncion >= ahora;
  });
}

/**
 * Agrupa los showtimes por película:
 * [{ titulo: 'Deadpool & Wolverine', horarios: ['16:10','18:40', ...] }, ...]
 */
export function groupByMovie(showtimes) {
  const map = new Map();

  for (const s of showtimes) {
    if (!map.has(s.titulo)) {
      map.set(s.titulo, []);
    }
    map.get(s.titulo).push(s.hora);
  }

  // Ordenamos los horarios de cada peli por hora
  const grupos = [];
  for (const [titulo, horas] of map.entries()) {
    const ordenadas = horas
      .slice()
      .sort((a, b) => {
        const [ha, ma] = a.split(':').map(Number);
        const [hb, mb] = b.split(':').map(Number);
        return ha === hb ? ma - mb : ha - hb;
      });

    grupos.push({ titulo, horarios: ordenadas });
  }

  return grupos;
}

/**
 * Escoge una película random de la lista agrupada
 */
export function pickRandomMovie(grouped) {
  if (!grouped.length) return null;
  const idx = Math.floor(Math.random() * grouped.length);
  return grouped[idx];
}

// Compara una hora "HH:mm" con la hora actual (en minutos)
export function isTimeFromNow(horaStr) {
  const [h, m] = horaStr.split(':').map(Number);

  const ahora = new Date();
  const ahoraMinutes = ahora.getHours() * 60 + ahora.getMinutes();

  const showMinutes = h * 60 + m;

  // true si el horario es igual o después de la hora actual
  return showMinutes >= ahoraMinutes;
}
