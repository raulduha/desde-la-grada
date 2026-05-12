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
  newsletter: {
    headline: 'No pierdas el',
    accentWord: 'Silbato',
    subtext: 'Entérate de lanzamientos limitados y reposiciones.',
  },
}
