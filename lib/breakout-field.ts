/**
 * Space opened up below the headline to play in, in CSS pixels.
 *
 * Its own module because two files have to agree on it and neither may import
 * the other. The 404 page centres its column vertically, so any change in that
 * column's height slides everything in it up or down by half the change — and
 * opening a field this tall moved the headline up by as much as 84px at the
 * exact moment the bricks replaced it, which read as the wall landing above the
 * type it was supposed to be taking over.
 *
 * So the column's height never changes. The game's wrapper grows by FIELD and,
 * in the same commit and on the same 500ms curve, the reserve at the bottom of
 * components/four-oh-four-game-slot gives up FIELD. The two are always each
 * other's complement, the sum is constant at every frame of the transition, and
 * the headline does not move at all.
 *
 * The cost is that the page reserves the play area from the start: at rest it
 * now stands as tall as it already stood mid-game.
 */
export const FIELD = 168;
