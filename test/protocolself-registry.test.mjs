import test from "node:test";
import assert from "node:assert/strict";
import { bootProtocolSelfRegistry } from "../runtime/protocolself-registry.mjs";
test("FLOWACTION seat boot binds to the pinned 18-entry registry without activating transport",()=>{const r=bootProtocolSelfRegistry();assert.equal(r.protocol_count,18);assert.equal(r.status,"REGISTRY_BOOTED_LISTENERS_DISABLED");assert.equal(r.network_listeners_started,0);assert.equal(r.external_bindings_created,0);assert.equal(r.network_transport_authority,"NOT_GRANTED");});
