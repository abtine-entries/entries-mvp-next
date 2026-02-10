/**
 * 8-bit pixel art avatar for Esme.
 *
 * 16x16 round face inspired by pixel-art emoji style.
 * Slightly blue skin (Entries brand), glasses, hair, and clipboard.
 *
 * 0 = transparent, 1 = skin, 2 = outline/dark, 3 = hair,
 * 4 = eye white, 5 = eye pupil, 6 = glasses frame,
 * 7 = mouth dark, 8 = teeth, 9 = highlight/shine,
 * 10 = clipboard, 11 = clipboard detail, 12 = hair highlight
 */

/* named constants for grid readability */
const _ = 0   // transparent
const S = 1   // skin
const O = 2   // outline
const H = 3   // hair
const W = 4   // eye white
const P = 5   // pupil
const G = 6   // glasses frame
const M = 7   // mouth
const T = 8   // teeth
const L = 9   // highlight
const K = 10  // clipboard
const D = 11  // clipboard detail
const R = 12  // hair highlight

const GRID = [
  [_,_,_,_,_,O,O,O,O,O,O,_,_,_,_,_],
  [_,_,_,O,O,H,H,H,H,H,H,O,O,_,_,_],
  [_,_,O,H,H,H,H,H,H,H,H,H,H,O,_,_],
  [_,O,H,H,R,H,H,H,H,H,R,H,H,H,O,_],
  [_,O,H,S,S,S,S,S,S,S,S,S,S,H,O,_],
  [O,H,S,S,S,S,S,S,S,S,S,S,S,S,H,O],
  [O,H,S,G,G,G,S,S,G,G,G,S,S,L,H,O],
  [O,H,S,G,W,P,G,G,G,W,P,G,S,S,H,O],
  [O,H,S,G,G,G,S,S,G,G,G,S,S,S,H,O],
  [O,H,S,S,S,S,S,S,S,S,S,S,S,S,H,O],
  [O,R,S,S,S,M,M,M,M,S,S,S,S,S,R,O],
  [_,O,H,S,S,M,T,T,M,S,S,S,S,H,O,_],
  [_,O,H,S,S,S,M,M,S,S,S,S,H,O,D,_],
  [_,_,O,H,S,S,S,S,S,S,S,H,O,K,K,K],
  [_,_,_,O,H,S,S,S,S,S,S,H,O,K,D,K],
  [_,_,_,_,O,H,H,O,O,H,H,O,_,K,K,K],
  [_,_,_,_,_,O,O,_,_,O,O,_,_,_,_,_],
]

const PALETTE: Record<number, string> = {
  [S]: 'hsl(214 40% 75%)',  // skin – light blue (Entries tint)
  [O]: 'hsl(214 50% 20%)',  // outline – dark blue
  [H]: 'hsl(214 30% 30%)',  // hair – dark blue-gray
  [W]: 'hsl(0 0% 95%)',     // eye whites
  [P]: 'hsl(214 60% 25%)',  // eye pupils – deep blue
  [G]: 'hsl(214 40% 35%)',  // glasses frame – medium blue
  [M]: 'hsl(214 50% 25%)',  // mouth – dark blue
  [T]: 'hsl(0 0% 95%)',     // teeth – white
  [L]: 'hsl(214 50% 88%)',  // highlight/shine – very light blue
  [K]: 'hsl(40 15% 80%)',   // clipboard body – warm off-white
  [D]: 'hsl(214 20% 50%)',  // clipboard detail – blue-gray lines
  [R]: 'hsl(214 25% 40%)',  // hair highlight
}

interface EsmeAvatarProps {
  className?: string
}

export function EsmeAvatar({ className }: EsmeAvatarProps) {
  return (
    <svg
      viewBox="0 0 16 17"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ shapeRendering: 'crispEdges' }}
      aria-label="Esme avatar"
      role="img"
    >
      {GRID.flatMap((row, y) =>
        row.map((cell, x) =>
          cell !== 0 ? (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={1}
              height={1}
              fill={PALETTE[cell]}
            />
          ) : null
        )
      )}
    </svg>
  )
}
