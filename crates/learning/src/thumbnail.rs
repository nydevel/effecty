use std::path::Path;

use anyhow::{Context, Result};

/// Fetch the Open Graph image URL from a web page's meta tags.
pub async fn fetch_og_image(url: &str) -> Result<Option<String>> {
    let response = reqwest::get(url)
        .await
        .context("failed to fetch page")?
        .text()
        .await
        .context("failed to read page body")?;

    let document = scraper::Html::parse_document(&response);
    let selector =
        scraper::Selector::parse(r#"meta[property="og:image"]"#).expect("valid selector");

    let og_image = document
        .select(&selector)
        .next()
        .and_then(|el| el.value().attr("content"))
        .map(String::from);

    Ok(og_image)
}

/// Extract a YouTube video thumbnail URL from a YouTube link.
pub fn extract_youtube_thumbnail(url: &str) -> Option<String> {
    let video_id = extract_youtube_id(url)?;
    Some(format!(
        "https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
    ))
}

fn extract_youtube_id(url: &str) -> Option<&str> {
    // youtube.com/watch?v=ID
    if let Some(pos) = url.find("v=") {
        let start = pos + 2;
        let rest = &url[start..];
        let end = rest.find('&').unwrap_or(rest.len());
        let id = &rest[..end];
        if !id.is_empty() {
            return Some(id);
        }
    }

    // youtu.be/ID
    if let Some(pos) = url.find("youtu.be/") {
        let start = pos + 9;
        let rest = &url[start..];
        let end = rest.find('?').unwrap_or(rest.len());
        let id = &rest[..end];
        if !id.is_empty() {
            return Some(id);
        }
    }

    None
}

/// Download an image from a URL and save it to disk.
pub async fn download_image(image_url: &str, dest: &Path) -> Result<()> {
    let bytes = reqwest::get(image_url)
        .await
        .context("failed to download image")?
        .bytes()
        .await
        .context("failed to read image bytes")?;

    if let Some(parent) = dest.parent() {
        tokio::fs::create_dir_all(parent).await?;
    }
    tokio::fs::write(dest, &bytes).await?;

    Ok(())
}

/// Generate a resized thumbnail from a source image.
pub fn generate_image_thumbnail(
    source_path: &Path,
    dest_path: &Path,
    max_dimension: u32,
) -> Result<()> {
    let img = image::open(source_path).context("failed to open image")?;
    let thumb = img.thumbnail(max_dimension, max_dimension);

    if let Some(parent) = dest_path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    thumb.save(dest_path).context("failed to save thumbnail")?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_youtube_id_watch() {
        assert_eq!(
            extract_youtube_id("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
            Some("dQw4w9WgXcQ")
        );
    }

    #[test]
    fn test_extract_youtube_id_short() {
        assert_eq!(
            extract_youtube_id("https://youtu.be/dQw4w9WgXcQ"),
            Some("dQw4w9WgXcQ")
        );
    }

    #[test]
    fn test_extract_youtube_id_with_params() {
        assert_eq!(
            extract_youtube_id("https://www.youtube.com/watch?v=abc123&t=10s"),
            Some("abc123")
        );
    }

    #[test]
    fn test_extract_youtube_id_none() {
        assert_eq!(extract_youtube_id("https://example.com"), None);
    }

    #[test]
    fn test_youtube_thumbnail() {
        assert_eq!(
            extract_youtube_thumbnail("https://youtu.be/dQw4w9WgXcQ"),
            Some("https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg".into())
        );
    }
}
