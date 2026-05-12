export interface LandingContent {
  hero: {
    image: string
    tagline: string
    headline: string
    accentWord: string
    description: string
    ctaText: string
  }
  editorial: {
    image: string
    tagline: string
    headline: string
    headlineAccent: string
    body: string
    badgeText: string
  }
  about: {
    tagline: string
    headline: string
    body: string
    item1Title: string
    item1Desc: string
    item2Title: string
    item2Desc: string
    item3Title: string
    item3Desc: string
  }
  newsletter: {
    headline: string
    accentWord: string
    subtext: string
  }
}

export const DEFAULT_LANDING: LandingContent = {
  hero: {
    image: '/landing.png',
    tagline: 'Est. 2024 — Cultura de Grada',
    headline: 'DESDE LA',
    accentWord: 'GRADA',
    description: 'Streetwear chileno. Hecho para los que viven el juego desde las gradas. Sin filtros, sin concesiones.',
    ctaText: 'Ver Colección',
  },
  editorial: {
    image: '',
    tagline: 'Volumen 01',
    headline: 'La Esencia',
    headlineAccent: 'de la Grada',
    body: 'Un tributo a las gradas. Cada pieza está diseñada para la máxima comodidad durante esos 90 minutos de pura adrenalina. Tejidos pesados, siluetas cuadradas y costuras indestructibles.',
    badgeText: 'Autenticidad Garantizada',
  },
  about: {
    tagline: 'Nuestra Historia',
    headline: 'Nacidos en las Gradas',
    body: 'DLG nació de las gradas. De esos 90 minutos que lo cambian todo. De la pasión que no cabe en ningún otro lugar. Creamos ropa para los que viven el fútbol de verdad.',
    item1Title: 'La Cultura del Estadio',
    item1Desc: 'Cada diseño nace de la arquitectura brutalista del concreto, los cantos de las gradas y la energía única que solo existe dentro de los grandes estadios.',
    item2Title: 'Momentos Icónicos',
    item2Desc: 'Inspirados en los instantes que definen generaciones. Las celebraciones, los golazos, los gestos que se graban para siempre en la memoria colectiva.',
    item3Title: 'Oversize para el Juego',
    item3Desc: 'Piezas construidas para resistir el frío de las gradas, el calor del verano y todo lo que viene entre el pitazo inicial y el silbato final.',
  },
  newsletter: {
    headline: 'No pierdas el',
    accentWord: 'Silbato',
    subtext: 'Entérate de lanzamientos limitados y reposiciones.',
  },
}
