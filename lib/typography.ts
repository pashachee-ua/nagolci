/** Keep short Ukrainian function words with the following word, preserving paragraphs. */
export function keepWordsTogether(text: string): string {
  return text.replace(/(?<![\p{L}\p{N}])(?:і|й|а|у|в|з|із|зі|до|на|та|не|за|по|від|під|над|для|без|при|про)[ \t]+(?=\S)/giu, word => word.trimEnd() + '\u00a0');
}

export function formatIntro(text: string): string {
  return keepWordsTogether(text).replace(/(?<![\p{L}\p{N}])(Разом)[ \t]+(?=\S)/gu, '$1\u00a0');
}
