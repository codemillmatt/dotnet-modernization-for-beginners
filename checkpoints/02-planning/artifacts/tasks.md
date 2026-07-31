# Upgrade task dashboard

This is a **model artifact** showing the shape of `tasks.md`. The agent writes and
overwrites this file. Never edit your own copy — see
[the cheat sheet](../../../docs/CHEAT-SHEET.md) for what is and isn't editable.
{: .warning }

- [x] 01 Baseline established and branch created
- [ ] 02 Migrate `packages.config` to `PackageReference`
- [ ] 03 Convert `BookCatalog.Web` to the SDK-style project format and retarget to net10.0
- [ ] 04 Move `Web.config` settings to `appsettings.json` and the options pattern
- [ ] 05 Replace `Global.asax` startup with `Program.cs`, DI, and middleware
- [ ] 06 Port controllers and views to ASP.NET Core MVC
- [ ] 07 Port EF6 data access and the seeding lifecycle to EF Core
- [ ] 08 Final build and behavior validation

Every task in this list belongs to the single `BookCatalog.Web` project. With no
project-to-project dependencies to sequence, the ordering argument moves inside the
project — and it still matters. Tasks 02 and 03 change the project file, so running them
before 05 and 06 means the code work lands once instead of twice.

The agent updates status. You approve status only after evidence satisfies `plan.md` —
and on a codebase without tests, "evidence" means you ran the app and looked.
