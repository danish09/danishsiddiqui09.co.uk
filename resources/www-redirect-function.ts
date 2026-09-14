import { Construct } from "constructs";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";

/**
 * Redirects `www.<domain>` to the bare domain, so the site has exactly one
 * canonical URL (better for search engines, and for anyone sharing links).
 *
 * A CloudFront Function runs at the edge on every viewer request, before
 * the cache is checked. It's the lightweight option (sub-millisecond, no
 * Lambda cold starts) and all it needs to do is inspect the Host header:
 * requests for `www` get a 301 to the same path on the bare domain, and
 * everything else passes through untouched.
 */
export function createWwwRedirectFunction(
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
  return request;
}
`;

  return new cloudfront.Function(scope, "WwwRedirectFunction", {
    code: cloudfront.FunctionCode.fromInline(code),
    runtime: cloudfront.FunctionRuntime.JS_2_0,
    comment: `Redirect www.${domainName} to ${domainName}`,
  });
}
