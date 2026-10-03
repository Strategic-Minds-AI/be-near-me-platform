# BNM Super-Agent Production Deployment Trigger

- Project: BNM-EA-V1
- Public production web SHA: `fe859eeaba6751f90a82a9a3049fd7e4141389fb`
- Railway service: `bnm-super-agent-runtime`
- Railway production environment: `24636941-7db3-4218-bfbf-e8388b41f41b`
- Dockerfile: `Dockerfile.agent`
- Persistent volume mount: `/data`
- Reconcile cadence: 300000 ms
- Trigger reason: first production deployment after validated container hardening
- Operator approval: PUSH TO PRODUCTION
- Safety: no public domain, no customer traffic, protected actions fail closed
