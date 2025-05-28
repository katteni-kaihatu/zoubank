export type ZouProps = {
  height?: string;
  width?: string;
};

export const Zou = ({ height, width }: ZouProps) => {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/zou.svg"
      alt="Zou"
      style={{
        height: height ?? "24px",
        width: width ?? "24px",
        display: "inline",
        verticalAlign: "text-bottom",
      }}
    />
  );
};
