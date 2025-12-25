package vn.liora.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.liora.entity.FooterColumn;

import java.util.List;

@Repository
public interface FooterColumnRepository extends JpaRepository<FooterColumn, Long> {

    @Query("SELECT fc FROM FooterColumn fc WHERE fc.footer.id = :footerId AND fc.isActive = true ORDER BY fc.columnOrder ASC")
    List<FooterColumn> findActiveColumnsByFooterId(@Param("footerId") Long footerId);

    @Query("SELECT fc FROM FooterColumn fc WHERE fc.footer.id = :footerId ORDER BY fc.columnOrder ASC")
    List<FooterColumn> findByFooterIdOrderByColumnOrder(@Param("footerId") Long footerId);
}
