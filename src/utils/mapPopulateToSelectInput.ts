export default function mapPopulateToSelectInput<
  T extends Record<string, unknown>,
>(populate: (keyof T)[]) {
  return populate.reduce(
    (acc, key) => {
      acc[key] = true;
      return acc;
    },
    {} as Record<keyof T, boolean>,
  );
}
