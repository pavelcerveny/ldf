const N3 = require('n3');
const jsonld = require('jsonld');
const _ = require('lodash');

const ViewGenerator = require('./ViewGenerator');

const contentTypes = 'application/trig;q=0.9,application/n-quads;q=0.7,' +
  'application/ld+json;q=0.8,application/json;q=0.8,' +
  'text/turtle;q=0.6,application/n-triples;q=0.5,text/n3;q=0.6';

const dcTerms = 'http://purl.org/dc/terms/';
const rdf = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
const hydra = 'http://www.w3.org/ns/hydra/core#';
const voID = 'http://rdfs.org/ns/void#';

const primaryTopic = 'http://xmlns.com/foaf/0.1/primaryTopic';

class RDFViewGenerator extends ViewGenerator {
  constructor (name) {
    super(name, contentTypes);
  }

  getWriter (settings, request, response, done) {
    settings.fragmentUrl = (settings.fragment && settings.fragment.url) || '';
    settings.metadataGraph = settings.fragmentUrl + '#metadata';
    settings.contentType = response.getHeader('Content-Type');

    settings.writer = /json/.test(settings.contentType) ? this.createJsonLdWriter(settings, response, done)
      : this.createN3Writer(settings, response, done);

    return settings;
  }

  addDatasources (settings, data, metadata) {
    const datasources = settings.datasources;
    for (let datasourceName in datasources) {
      if (datasources.hasOwnProperty(datasourceName)) {
        const datasource = datasources[datasourceName];
        metadata(datasource.url, rdf + 'type', voID + 'Dataset');
        metadata(datasource.url, rdf + 'type', hydra + 'Collection');
        metadata(datasource.url, dcTerms + 'title', '"' + datasource.title + '"');
      }
    }
  }

  createN3Writer (settings, response, done) {
    const writer = new N3.Writer({ format: settings.contentType, prefixes: settings.prefixes });
    const supportsGraphs = /trig|quad/.test(settings.contentType);
    let metadataGraph;

    return {
      // Adds the data triple to the output
      data: function (s, p, o, g) {
        writer.addTriple(s, p, o, supportsGraphs ? g : null);
      },
      // Adds the metadata triple to the output
      meta: function (s, p, o) {
        // Relate the metadata graph to the data
        if (supportsGraphs && !metadataGraph) {
          metadataGraph = settings.metadataGraph;
          writer.addTriple(metadataGraph, primaryTopic, settings.fragmentUrl, metadataGraph);
        }
        // Write the triple
        if (s && p && o && !N3.Util.isLiteral(s)) {
          writer.addTriple(s, p, o, metadataGraph);
        }
      },
      // Ends the output and flushes the stream
      end: function () {
        writer.end(function (error, output) {
          response.write(error ? '' : output);
          done();
        });
      }
    };
  }

  createJsonLdWriter (settings, response, done) {
    // Initialize triples, prefixes, and document base
    const quads = { '@default': [] };
    const metadata = quads[settings.metadataGraph] = [];
    const prefixes = settings.prefixes || {};
    const context = _.omit(prefixes, '');
    const base = prefixes[''];

    base && (context['@base'] = base);

    return {
      // Adds the data triple to the output
      data: function (s, p, o, g) {
        if (!p) {
          g = s.graph;
          o = s.object;
          p = s.predicate;
          s = s.subject;
        }
        if (!g) {
          g = '@default';
        }
        let graph = quads[g] || (quads[g] = []);
        graph.push(this.toJsonLdTriple(s, p, o));
      },
      // Adds the metadata triple to the output
      meta: function (s, p, o) {
        if (s && p && o && !N3.Util.isLiteral(s)) {
          metadata.push(this.toJsonLdTriple(s, p, o));
        }
      },
      // Ends the output and flushes the stream
      end: function () {
        jsonld.fromRDF(quads, { format: false, useNativeTypes: true },
          function (error, json) {
            jsonld.compact(error ? {} : json, context, function (error, compacted) {
              response.write(JSON.stringify(compacted, null, '  ') + '\n');
              done(error);
            });
          });
      }
    };
  }

  // Converts a triple to the JSON-LD library representation
  toJsonLdTriple (subject, predicate, object) {
    return {
      subject:   { value: subject,   type: subject[0]   !== '_' ? 'IRI' : 'blank node' },
      predicate: { value: predicate, type: predicate[0] !== '_' ? 'IRI' : 'blank node' },
      object: !N3.Util.isLiteral(object) ?
        { value: object,    type: object[0]    !== '_' ? 'IRI' : 'blank node' } :
        {
          value:    N3.Util.getLiteralValue(object),
          datatype: N3.Util.getLiteralType(object),
          language: N3.Util.getLiteralLanguage(object),
        }
    };
  }
}

module.exports = RDFViewGenerator;
