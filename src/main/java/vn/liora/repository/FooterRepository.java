package vn.liora.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import vn.liora.entity.Footer;

import java.util.Optional;

@Repository
public interface FooterRepository extends JpaRepository<Footer, Long> {

    @Query("SELECT f FROM Footer f WHERE f.isActive = true ORDER BY f.createdAt DESC")
    Optional<Footer> findActiveFooter();

    @Query("SELECT f FROM Footer f WHERE f.isActive = true")
    Optional<Footer> getActiveFooter();
}
