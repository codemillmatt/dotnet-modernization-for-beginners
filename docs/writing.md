# Writing guide

Use short, direct English for lesson text, interface messages, and instructions.

## Rules for authors

1. State one instruction per sentence.
2. Use active voice for procedures.
3. Keep instructions within 20 words where technical precision permits.
4. Keep descriptions within 25 words.
5. Use one topic per paragraph.
6. Replace semicolons with separate sentences.
7. Use the same term for the same action.
8. Keep uncertainty, warnings, and scope limits.

Keep commands, identifiers, product names, and quoted output exact. Do not shorten an instruction by removing a safety condition.

Use strict structural rules for procedures and errors. Use STE-flavored prose for explanations. Keep the visual design playful without making the instructions obscure.

## Terms used in this course

| Term | Meaning |
| --- | --- |
| Assessment | The agent's findings about the current application |
| Plan | The chosen changes, their order, and their checks |
| Runnable group | A set of coupled changes with a stated runnable result |
| Checkpoint | A reviewed Git commit and its recorded checks |
| Compatibility | Whether existing source, binaries, or behavior work with a change |
| Business priority | The importance of affected behavior to its users |
| Dependency injection | The application supplies a configured object to code that needs it |
| Managed identity | An Azure identity that the application uses to access supported services |
| Core completion | The learner's confirmation of the required chapter checks |

## Language checks

The project uses the requested [ASD-STE100 skill](https://github.com/danyuchn/asd-ste100-skill) as an editorial guide.

The included linter checks structural patterns. It does not contain the official ASD dictionary.

The vendor copy comes from commit `7d4a135a199a5d7447c4886bcd7ffe742a627bc9`. Its MIT license remains in `tools/vendor/STE-LICENSE`.

The wrapper excludes code, historical records, and third-party notices. It treats each table cell as separate text.

Review synonym findings manually. For example, deleting a database and removing a package are different operations.

Run `npm run test:language` from the repository root.

Passing these checks is not certified ASD-STE100 compliance. Review the meaning and technical accuracy too.
