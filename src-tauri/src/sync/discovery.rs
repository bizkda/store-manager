use std::time::Duration;

pub async fn scan_local_network(my_ip: &str) -> Vec<String> {
    let parts: Vec<&str> = my_ip.split('.').collect();
    if parts.len() != 4 {
        return vec![];
    }
    let prefix = format!("{}.{}.{}", parts[0], parts[1], parts[2]);

    let client = reqwest::Client::builder()
        .timeout(Duration::from_millis(300))
        .build()
        .unwrap();

    let mut tasks = vec![];
    for i in 1..255 {
        let candidate_ip = format!("{}.{}", prefix, i);
        if candidate_ip == my_ip {
            continue;
        }
        let client = client.clone();
        tasks.push(tokio::spawn(async move {
            let url = format!("http://{}:7878/movements?since=1970-01-01T00:00:00Z", candidate_ip);
            match client.get(&url).send().await {
                Ok(resp) if resp.status().is_success() => Some(candidate_ip),
                _ => None,
            }
        }));
    }

    let mut found = vec![];
    for task in tasks {
        if let Ok(Some(ip)) = task.await {
            found.push(ip);
        }
    }
    found
}