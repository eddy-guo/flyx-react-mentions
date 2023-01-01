import Fuse from "fuse.js";
import { createRef, useRef, useState } from "react";
import styles from "../styles/Home.module.css";
import ContentEditable from "react-contenteditable";
import { Person, getAllDataByIndex } from "../functions/getNames";

export default function Home({
    employees,
    customers,
}: {
    employees: Person[];
    customers: Person[];
}) {
    // Users + Customers
    const people: { type: string; value: Person }[] = [
        ...employees.map((employee) => ({ type: "employee", value: employee })),
        ...customers.map((customer) => ({ type: "customer", value: customer })),
    ];

    // Create fuzzy search
    const peopleIndex = new Fuse(people, {
        keys: ["value.firstName", "value.lastName"],
        isCaseSensitive: false,
        shouldSort: true,
    });

    // Search index
    const searchPeopleIndex = (): { type: string; value: Person }[] => {
        return peopleIndex
            .search(search.slice(1)) // Remove @
            .map(({ item: { type, value } }) => ({ type, value }));
    };

    // Input ref
    const inputRef = createRef<HTMLElement>();
    // Search value
    const [search, setSearch] = useState<string>("");
    // textarea value update
    const [text, setText] = useState<string>("");

    const handleKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
        // Shadow text
        let text = inputRef.current?.innerHTML ?? "";
        // Check if current word begins with @
        const allWords: string[] = text.split(" ");
        // Get last word in input
        const lastWord =
            allWords.length > 0 ? allWords[allWords.length - 1] : "";

        // If user presses enter + search is non-empty
        if (lastWord.startsWith("@")) {
            setSearch(lastWord);

            if (event.key === "Enter") {
                // Check if some results exist
                const results = searchPeopleIndex();
                // If some results exist
                if (results.length > 0) {
                    // Update string with name
                    text = text.replace(
                        lastWord,
                        `<span class="${results[0].type}">${results[0].value.firstName} ${results[0].value.lastName}</span> `
                    );
                    // Empty search
                    setSearch("");

                    // Return cursor to same-line (prevent actual enter)
                    event.preventDefault();
                }
            }
        } else {
            setSearch(""); // Default case
        }

        setText(text);
    };

    return (
        <main className={styles.main}>
            <div className={styles.textbox}>
                <ContentEditable
                    className={styles.input}
                    innerRef={inputRef}
                    html={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => handleKey(e)}
                    placeholder='Use the "@" symbol to mention someone!'
                />

                {search && (
                    <div className={styles.dropdown}>
                        {searchPeopleIndex().map(
                            ({ type, value: person }, i) => {
                                return (
                                    <div key={i}>
                                        <span>
                                            {person.firstName} {person.lastName}
                                        </span>
                                        <span> {type}</span>
                                    </div>
                                );
                            }
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}

export async function getServerSideProps() {
    // Collect employees + customers from ElasticSearch on page-load
    const employees: Person[] = await getAllDataByIndex("employees");
    const customers: Person[] = await getAllDataByIndex("customers");

    return {
        props: {
            employees,
            customers,
        },
    };
}
