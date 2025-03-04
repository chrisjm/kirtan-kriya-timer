// Time formatting utilities
export const millisecondsToSeconds = (milliseconds: number): number => Math.round(milliseconds / 1000);
export const secondsToMinutes = (seconds: number): number => Math.floor(seconds / 60);
export const padWithZeroes = (number: number): string => number.toString().padStart(2, '0');

export function formatTime(milliseconds: number): string {
  const seconds = millisecondsToSeconds(milliseconds);
  return `${padWithZeroes(secondsToMinutes(seconds))}:${padWithZeroes(seconds % 60)}`;
}
