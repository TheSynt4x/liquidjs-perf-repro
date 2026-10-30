// Deterministic synthetic email payload shaped like a component-row email.
const types = ['text', 'button', 'image']
function block (r, c, b) {
  const type = types[(r + c + b) % 3]
  return {
    type,
    params: {
      content: `Row ${r} col ${c} hello {name}, lorem ipsum dolor sit amet. `,
      greeting: b === 0,
      label: `Click ${r}.${c}`,
      href: `https://example.com/p/${r}/${c}`,
      src: `https://cdn.example.com/img/${r}-${c}.png`,
      alt: `Image <${r}>`,
      rounded: b % 2 === 0,
      style: b % 2 ? { color: '#333', fontSize: 14 } : {}
    }
  }
}
module.exports = function makeData (rows = 40) {
  return {
    user: { id: 42, firstName: 'ada', lastName: 'lovelace' },
    theme: {
      colors: { background: '#eee', surface: '#fff', text: '#111', primary: '#06c' },
      spacing: { sm: 8, md: 16 },
      font: { size: 16, family: 'Arial' },
      radius: 4,
      layout: { maxWidth: 600 }
    },
    email: {
      subject: 'Your <weekly> digest',
      footer: { year: 2026 },
      rows: Array.from({ length: rows }, (_, r) => ({
        visible: r % 7 !== 6,
        settings: { fullWidth: r % 3 === 0, padding: r % 2 ? 12 : undefined },
        columns: Array.from({ length: 1 + (r % 3) }, (_, c) => ({
          width: 100 / (1 + (r % 3)),
          blocks: Array.from({ length: 3 }, (_, b) => block(r, c, b))
        }))
      }))
    }
  }
}
