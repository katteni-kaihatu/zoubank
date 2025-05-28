export const resdb2url = (
  resdb: string,
):
  | { status: "success"; data: string }
  | { status: "error"; data?: undefined } => {
  const result = resdb.match(/^resdb:\/\/\/([0-9a-f]*)/);
  if (!result) {
    return { status: "error" };
  }
  return {
    status: "success",
    data: `https://assets.resonite.com/${result[1]}`,
  };
};
