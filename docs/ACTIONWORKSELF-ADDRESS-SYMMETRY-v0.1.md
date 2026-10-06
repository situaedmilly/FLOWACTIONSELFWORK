# ACTIONWORKSELF Address Symmetry v0.1

ActionWorkSelf mirrors the AddressSelf pointer contract without changing its execution semantics.

The same graph primitives are available:

- `WHERE_IS(target)`
- `RESOLVE(address)`
- `CHILDREN_OF(parent_id)`
- `PARENT_OF(node_id)`
- `CREATE_CHILD(parent_id, node)`

AddressSelf answers **where** an endpoint/service/route exists. ActionWorkSelf answers **where an executable action/work node exists**.

Symmetry is structural, not a claim that the two repositories contain identical runtime bytes.

## Canonical relationship

```
ADDRESSSELF
    ROOT ADDRESS
       ↓
    SERVICE
       ↓
    ROUTE

ACTIONWORKSELF
    ROOT WORK
       ↓
    ACTION
       ↓
    EXECUTION TARGET
       ↓
    EFFECT / RECEIPT
```

The shared invariant is:

```
parent → child → addressable node → resolvable node
```

Authority, execution, and effect remain separate from addressability.
