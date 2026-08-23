export type Output = {
	name: string;
	amount: number;
	probability?: number;
};

export type Recipe = {
	key: string;
	entropy: number;
	crafting_speed: number;
	outputs: Output[];
};
