mod product_repository;
mod sale_repository;

pub use product_repository::{ProductRepository, SqliteProductRepository};
pub use sale_repository::{SaleRepository, SqliteSaleRepository};