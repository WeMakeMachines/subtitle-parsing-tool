import { Cue } from '../../types';
import TimeStamps from '../../lib/TimeStamps/index';

class ParserError extends Error {}

export default abstract class Parser {
	abstract timeStampMarker: string;
	abstract parse(string: string): Cue[];

	static processStringToArray(string: string): string[] {
		return string.split('\n');
	}

	static processArrayToArrayBlocks(array: string[]): string[][] {
		return array.reduce(
			(arrayBlockAccumulator: string[][], currentLine: string) => {
				if (currentLine === '') {
					arrayBlockAccumulator.push([]);
				} else {
					arrayBlockAccumulator[
						arrayBlockAccumulator.length - 1
					].push(currentLine);
				}

				return arrayBlockAccumulator;
			},
			[[]]
		);
	}

	static dropEmptyArrayBlocks(arrayBlocks: string[][]): string[][] {
		return arrayBlocks.filter(arrayBlock => arrayBlock.length);
	}

	static processArrayBlocksToCues(
		arrayBlocks: string[][],
		timeStampMarker: string
	): Cue[] {
		return arrayBlocks.map((block, blockIndex) => {
			const processedCue = block.reduce(
				(cue: Cue, string: string, index: number): Cue => {
					// Ignore cue identifier
					if (index === 0 && !string.includes(timeStampMarker)) {
						return cue;
					}

					if (!cue.endTime && string.includes(timeStampMarker)) {
						const timeStamps = TimeStamps.parseTimeStamps(
							string,
							timeStampMarker
						);

						if (timeStamps) {
							cue.startTime = timeStamps.startTime;
							cue.endTime = timeStamps.endTime;
						}

						return cue;
					}

					cue.text.push(string);

					return cue;
				},
				{
					sequence: blockIndex,
					startTime: 0,
					endTime: 0,
					text: []
				}
			);

			if (processedCue.endTime <= processedCue.startTime) {
				throw new ParserError('Invalid Cue: Timecodes not valid');
			}

			return processedCue;
		});
	}
}
