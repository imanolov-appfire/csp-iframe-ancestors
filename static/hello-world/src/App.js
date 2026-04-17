import React from "react";

const App = () => (
  <div style={{ fontFamily: "sans-serif", padding: 16 }}>
    <h2>Forge tunnel + custom domain CSP repro</h2>
    <p>
      The iframe below loads <code>./embedded.html</code> &mdash; a page served
      from the <strong>same Forge resource</strong> as this parent (same origin,
      same <code>localhost</code> port under <code>forge tunnel</code>).
    </p>
    <ul>
      <li>
        On a stock <code>*.atlassian.net</code> site: loads fine under{" "}
        <code>forge tunnel</code>.
      </li>
      <li>
        On a Jira site that uses a <strong>custom domain</strong>: blocked under{" "}
        <code>forge tunnel</code> by Forge&rsquo;s injected{" "}
        <code>frame-ancestors</code> directive, which does not include the
        customer custom domain.
      </li>
      <li>In production on either kind of site: loads fine.</li>
    </ul>
    <iframe
      src="./embedded.html"
      title="Same-origin embedded page"
      style={{
        width: "100%",
        height: 200,
        border: "1px solid #dfe1e6",
        borderRadius: 4,
      }}
    />
  </div>
);

export default App;
