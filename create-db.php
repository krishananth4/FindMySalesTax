<?php

// Creating the database file
$database_file = __DIR__ . "taxrates.db";

try {
    // Creating a database instance
    $pdo = new PDO('sqlite:' . $database_file);
    // Error handling
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // Using this SQL query to create the database
    $create_table = "CREATE TABLE IF NOT EXISTS sales_tax (
                id integer PRIMARY KEY AUTOINCREMENT,
                state text,
                county text,
                tax_rate text
            )";
    // Executing the SQL query
    $pdo->exec($create_table);
    // Grabbing all the JSON files within the JSON folder through * and glob() function's matching capabilites
    $json_files = glob(__DIR__ . "/JSON/*.json");

    // Inserting the data into the database
    $insert_into_table = "
                         INSERT OR REPLACE INTO sales_tax
                         (state, county, tax_rate)
                         VALUES
                         (:state, :county, :tax_rate)
                        ";
    // Preparing the query to be executed
    $prepare_query = $pdo->prepare($insert_into_table);
    // Loop to loop through the JSON files
    foreach ($json_files as $file) {
        // Grabbing the contents of the JSON file
        $json_data = file_get_contents($file);
        // Decoding the data from teh JSON file and making it accessible as an array
        $data = json_decode($json_data, true);
        // Setting the state variable grabbed from the JSON
        $state = $data["state"];
        // Setting the counties variable grabbed from the JSON
        $counties = $data["counties"];
        // Looping through the counties data to grab name and tax rate
        foreach ($counties as $county_data) {
            // Grabbing the name of the county in from the JSON file
            $county_name = $county_data["name"];
            // Grabbing the tax rate from the JSON file
            $tax_rate = $county_data["taxRate"];
            // Adding the data to the db
            $prepare_query->execute([
                ":state" => $state,
                ":county" => $county_name,
                ":tax_rate" => $tax_rate
            ]);
        }
    }

    echo "NOTE: Inserted data into database successfully!";

    /* Displaying the database as a test to make sure database is populated */
    // $test_query = $pdo->query("SELECT * from sales_tax");
    // $fields = $test_query->fetchAll(PDO::FETCH_ASSOC);
    // foreach ($fields as $field) {
    //     print_r($field);
    // }


} catch (Exception $e) {
    echo "ERROR: Problem in the database setup! " . $e->getMessage();
    exit(1);
}


?>