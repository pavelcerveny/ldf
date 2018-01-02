// Compiled using marko@4.7.4 - DO NOT EDIT
"use strict";

var marko_template = module.exports = require("marko/dist/html").t(__filename),
    marko_componentType = "/ldf$1.0.0/src/views/index.marko",
    components_helpers = require("marko/dist/components/helpers"),
    marko_renderer = components_helpers.r,
    marko_defineComponent = components_helpers.c,
    marko_helpers = require("marko/dist/runtime/html/helpers"),
    marko_escapeXml = marko_helpers.x,
    marko_escapeXmlAttr = marko_helpers.xa,
    marko_loadTag = marko_helpers.t,
    component_globals_tag = marko_loadTag(require("marko/dist/components/taglib/component-globals-tag")),
    init_components_tag = marko_loadTag(require("marko/dist/components/taglib/init-components-tag")),
    await_reorderer_tag = marko_loadTag(require("marko/dist/taglibs/async/await-reorderer-tag"));

function render(input, out, __component, component, state) {
  var data = input;

  out.w("<!DOCTYPE html><html lang=\"en\" prefix=\"hydra: http://www.w3.org/ns/hydra/core# void: http://rdfs.org/ns/void#\"><head><meta charset=\"utf-8\"><title>" +
    marko_escapeXml((input.title || input.header) || "Linked Data Fragments Server") +
    "</title><link rel=\"stylesheet\" href=\"" +
    marko_escapeXmlAttr(input.assetsPath) +
    "/styles/ldf-server.css\"><link rel=\"stylesheet\" href=\"//fonts.googleapis.com/css?family=Open+Sans:700italic,400,700|Droid+Sans+Mono\" type=\"text/css\"><meta name=\"viewport\" content=\"width=device-width,minimum-scale=1,maximum-scale=1\"></head><body>");

  component_globals_tag({}, out);

  out.w("<header><h1><a href=\"" +
    marko_escapeXmlAttr(input.baseURL) +
    "\">" +
    marko_escapeXml(input.header || "Linked Data Fragments Server") +
    "</a></h1><figure class=\"logo\"><a href=\"http://linkeddatafragments.org/\"><img src=\"" +
    marko_escapeXmlAttr(input.assetsPath) +
    "/images/logo.svg\" alt=\"Linked Data Fragments\"></a></figure></header><main></main><footer><p>Powered by a <a href=\"https://github.com/LinkedDataFragments/Server.js\" target=\"_blank\">Linked Data Fragments Server</a> ©2013–" +
    marko_escapeXml((new Date()).getFullYear()) +
    " Ghent University – imec</p></footer>");

  init_components_tag({}, out);

  await_reorderer_tag({}, out, __component, "18");

  out.w("</body></html>");
}

marko_template._ = marko_renderer(render, {
    ad_: true,
    _l_: marko_componentType
  });

marko_template.Component = marko_defineComponent({}, marko_template._);

marko_template.meta = {
    id: "/ldf$1.0.0/src/views/index.marko",
    tags: [
      "marko/dist/components/taglib/component-globals-tag",
      "marko/dist/components/taglib/init-components-tag",
      "marko/dist/taglibs/async/await-reorderer-tag"
    ]
  };
