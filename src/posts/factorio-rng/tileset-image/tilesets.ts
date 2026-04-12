import qualityTileset from './quality-tileset.png';
import recipeTileset from './recipe-tileset.png';
import recipeTilesetMapData from './recipe-tileset-map.json';

export type TilesetMap = Record<string, readonly [number, number]>;

export const qualityTilesetMap: TilesetMap = {
  normal: [0, 0],
  uncommon: [64, 0],
  rare: [128, 0],
  epic: [192, 0],
  legendary: [256, 0]
};

export const recipeTilesetMap: TilesetMap = recipeTilesetMapData as unknown as TilesetMap;

export { qualityTileset, recipeTileset };