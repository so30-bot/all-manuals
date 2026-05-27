declare module 'robots-parser' {
  type Robots = {
    isAllowed(url: string, userAgent?: string): boolean | undefined;
  };

  export default function robotsParser(robotsUrl: string, robotsTxt: string): Robots;
}
