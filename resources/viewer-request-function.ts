import { Construct } from "constructs";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";

/**
 * Runs at the edge on every viewer request, before the cache is checked
 * (a CloudFront Function: sub-millisecond, no Lambda cold starts). Two jobs:
 *
 * 1. Redirect `www.<domain>` to the bare domain, so the site has exactly one
 *    canonical URL (better for search engines, and for anyone sharing links).
 *
 * 2. Map clean URLs to the files in the bucket: `/experience` becomes
 *    `/experience.html`. S3 has no notion of "index resolution" for a
 *    private OAC origin — it would look for an object literally named
 *    `experience` and fail — so the site's nav links only work because of
 *    this rewrite. `/` is handled by the distribution's defaultRootObject.
 */
export function createViewerRequestFunction(
  scope: Construct,
  domainName: string
): cloudfront.Function {
  // CloudFront Functions run a restricted ES5-ish JavaScript runtime, so
  // the handler is plain `var`/`function` syntax rather than modern TS.
  const code = `
function handler(event) {
  var request = event.request;
  var host = request.headers.host.value;

  if (host === "www.${domainName}") {
    var location = "https://${domainName}" + request.uri;
    if (request.querystring && Object.keys(request.querystring).length > 0) {
      location += "?" + Object.keys(request.querystring)
        .map(function (k) { return k + "=" + request.querystring[k].value; })
        .join("&");
    }
    return {
      statusCode: 301,
      statusDescription: "Moved Permanently",
      headers: { location: { value: location } },
    };
  }

  // Clean URL → file. Only for paths with no extension in the last
  // segment, so /style.css, /cv.pdf etc. pass through untouched.
  var uri = request.uri;
  if (uri.length > 1 && uri.charAt(uri.length - 1) === "/") {
    uri = uri.slice(0, -1);
  }
  if (uri !== "/" && uri.split("/").pop().indexOf(".") === -1) {
    request.uri = uri + ".html";
  }
  return request;
}
`;

  return new cloudfront.Function(scope, "ViewerRequestFunction", {
    code: cloudfront.FunctionCode.fromInline(code),
    runtime: cloudfront.FunctionRuntime.JS_2_0,
    comment: `www redirect + clean-URL rewrite for ${domainName}`,
  });
}
